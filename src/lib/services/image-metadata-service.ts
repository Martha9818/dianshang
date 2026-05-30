export type ImageDimensions = {
  width: number | null;
  height: number | null;
};

export function readImageDimensionsFromBuffer(buffer: Buffer): ImageDimensions {
  try {
    if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }

    if (buffer.length >= 10 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }

        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (length < 2) break;

        if (marker >= 0xc0 && marker <= 0xc3) {
          return {
            width: buffer.readUInt16BE(offset + 7),
            height: buffer.readUInt16BE(offset + 5),
          };
        }

        offset += 2 + length;
      }
    }

    if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
      const chunk = buffer.toString("ascii", 12, 16);
      if (chunk === "VP8X") {
        return {
          width: buffer[24] + (buffer[25] << 8) + (buffer[26] << 16) + 1,
          height: buffer[27] + (buffer[28] << 8) + (buffer[29] << 16) + 1,
        };
      }

      if (chunk === "VP8 " && buffer.length >= 30) {
        return {
          width: buffer.readUInt16LE(26) & 0x3fff,
          height: buffer.readUInt16LE(28) & 0x3fff,
        };
      }

      if (chunk === "VP8L" && buffer.length >= 25) {
        const bits = buffer.readUInt32LE(21);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
    }
  } catch {
    return { width: null, height: null };
  }

  return { width: null, height: null };
}

export async function readImageDimensions(file: File): Promise<ImageDimensions> {
  try {
    return readImageDimensionsFromBuffer(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { width: null, height: null };
  }
}
