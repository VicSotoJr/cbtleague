import AppKit
import Foundation
import Vision

struct TeamSeason: Decodable {
    let roster: [RosterPlayer]
}

struct RosterPlayer: Decodable {
    let name: String
    let PlayerHead: String?
}

struct CropEntry: Encodable {
    let objectPosition: String
    let scale: Double
    let brightness: Double
    let saturation: Double
}

let fileManager = FileManager.default
let rootURL = URL(fileURLWithPath: fileManager.currentDirectoryPath)

let seasonPaths = [
    "src/data/seasons/teams.json",
    "src/data/seasons/teams_season2.json",
    "src/data/seasons/teams_season3.json",
]

let outputURL = rootURL.appendingPathComponent("src/data/player-profile-crops.generated.json")

func normalizeKey(_ value: String) -> String {
    value
        .trimmingCharacters(in: .whitespacesAndNewlines)
        .lowercased()
        .replacingOccurrences(of: "\\s+", with: "", options: .regularExpression)
        .replacingOccurrences(of: "[’'`]", with: "", options: .regularExpression)
        .replacingOccurrences(of: "[^a-z0-9._-]", with: "", options: .regularExpression)
}

func clamp(_ value: Double, _ minValue: Double, _ maxValue: Double) -> Double {
    max(minValue, min(maxValue, value))
}

func roundTo(_ value: Double, places: Int) -> Double {
    let factor = pow(10.0, Double(places))
    return (value * factor).rounded() / factor
}

func detectCrop(for imageURL: URL) -> CropEntry? {
    guard
        let image = NSImage(contentsOf: imageURL)
    else {
        return nil
    }

    var proposedRect = CGRect(origin: .zero, size: image.size)
    guard let cgImage = image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
        return nil
    }

    let request = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

    do {
        try handler.perform([request])
    } catch {
        return nil
    }

    guard
        let observations = request.results as? [VNFaceObservation],
        let face = observations.max(by: { ($0.boundingBox.width * $0.boundingBox.height) < ($1.boundingBox.width * $1.boundingBox.height) })
    else {
        return nil
    }

    let width = Double(cgImage.width)
    let height = Double(cgImage.height)
    let baseVisible = min(width, height)

    let faceX = Double(face.boundingBox.minX) * width
    let faceWidth = Double(face.boundingBox.width) * width
    let faceHeight = Double(face.boundingBox.height) * height
    let faceTop = (1.0 - Double(face.boundingBox.maxY)) * height

    let desiredCrop = max(faceHeight * 5.0, faceWidth * 3.0)
    let scale = clamp(baseVisible / desiredCrop, 1.0, 1.55)
    let cropSize = baseVisible / scale

    let desiredTop = faceTop - faceHeight * 0.85
    let desiredLeft = (faceX + faceWidth / 2.0) - cropSize / 2.0

    let xPercent: Double
    if width <= cropSize {
        xPercent = 50.0
    } else {
        xPercent = clamp((desiredLeft / (width - cropSize)) * 100.0, 0.0, 100.0)
    }

    let yPercent: Double
    if height <= cropSize {
        yPercent = 50.0
    } else {
        yPercent = clamp((desiredTop / (height - cropSize)) * 100.0, 0.0, 100.0)
    }

    return CropEntry(
        objectPosition: "\(roundTo(xPercent, places: 1))% \(roundTo(yPercent, places: 1))%",
        scale: roundTo(scale, places: 2),
        brightness: 0.9,
        saturation: 0.92
    )
}

var playerToHeadshot: [String: String] = [:]

for seasonPath in seasonPaths {
    let seasonURL = rootURL.appendingPathComponent(seasonPath)
    let seasonData = try JSONDecoder().decode([TeamSeason].self, from: Data(contentsOf: seasonURL))

    for team in seasonData {
        for player in team.roster {
            let key = normalizeKey(player.name)
            guard !key.isEmpty else { continue }
            if let head = player.PlayerHead, !head.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                playerToHeadshot[key] = head
            } else if playerToHeadshot[key] == nil {
                playerToHeadshot[key] = ""
            }
        }
    }
}

var result: [String: CropEntry] = [:]

for (playerKey, fileName) in playerToHeadshot {
    guard !fileName.isEmpty else { continue }
    let imageURL = rootURL.appendingPathComponent("public/images/player-heads/\(fileName)")
    guard fileManager.fileExists(atPath: imageURL.path) else { continue }
    if let crop = detectCrop(for: imageURL) {
        result[playerKey] = crop
    }
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
let encoded = try encoder.encode(result)
try encoded.write(to: outputURL)
print("Generated \(result.count) player profile crops -> \(outputURL.path)")
