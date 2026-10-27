/**
 * Pure TypeScript ZIP Archive Builder (Standard PKZIP format, STORE method)
 * Creates a valid .zip binary Uint8Array from a list of { path, content } files.
 */

export interface ZipFileEntry {
  path: string;
  content: string;
}

// Precompute CRC32 table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipArchive(files: ZipFileEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const encodedFiles = files.map((f) => {
    const nameBytes = encoder.encode(f.path.replace(/^\/+/, ''));
    const dataBytes = encoder.encode(f.content);
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  // Calculate total size
  let localHeadersSize = 0;
  let centralDirSize = 0;

  for (const file of encodedFiles) {
    localHeadersSize += 30 + file.nameBytes.length + file.dataBytes.length;
    centralDirSize += 46 + file.nameBytes.length;
  }

  const totalSize = localHeadersSize + centralDirSize + 22; // 22 for End of Central Directory (EOCD)
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  let offset = 0;
  const localHeaderOffsets: number[] = [];

  // 1. Write Local File Headers + File Data
  for (const file of encodedFiles) {
    localHeaderOffsets.push(offset);

    // Local file header signature (0x04034b50)
    view.setUint32(offset, 0x04034b50, true);
    // Version needed to extract (2.0)
    view.setUint16(offset + 4, 20, true);
    // General purpose bit flag (UTF-8 = bit 11 = 0x0800)
    view.setUint16(offset + 6, 0x0800, true);
    // Compression method (0 = STORE / uncompressed)
    view.setUint16(offset + 8, 0, true);
    // Last mod file time & date
    view.setUint16(offset + 10, 0x4000, true);
    view.setUint16(offset + 12, 0x5555, true);
    // CRC-32
    view.setUint32(offset + 14, file.crc, true);
    // Compressed size
    view.setUint32(offset + 18, file.dataBytes.length, true);
    // Uncompressed size
    view.setUint32(offset + 22, file.dataBytes.length, true);
    // File name length
    view.setUint16(offset + 26, file.nameBytes.length, true);
    // Extra field length
    view.setUint16(offset + 28, 0, true);

    offset += 30;
    buffer.set(file.nameBytes, offset);
    offset += file.nameBytes.length;

    buffer.set(file.dataBytes, offset);
    offset += file.dataBytes.length;
  }

  const centralDirOffset = offset;

  // 2. Write Central Directory Headers
  for (let i = 0; i < encodedFiles.length; i++) {
    const file = encodedFiles[i];
    const localOffset = localHeaderOffsets[i];

    // Central file header signature (0x02014b50)
    view.setUint32(offset, 0x02014b50, true);
    // Version made by
    view.setUint16(offset + 4, 20, true);
    // Version needed to extract
    view.setUint16(offset + 6, 20, true);
    // General purpose bit flag (UTF-8)
    view.setUint16(offset + 8, 0x0800, true);
    // Compression method (0 = STORE)
    view.setUint16(offset + 10, 0, true);
    // Last mod time & date
    view.setUint16(offset + 12, 0x4000, true);
    view.setUint16(offset + 14, 0x5555, true);
    // CRC-32
    view.setUint32(offset + 16, file.crc, true);
    // Compressed size
    view.setUint32(offset + 20, file.dataBytes.length, true);
    // Uncompressed size
    view.setUint32(offset + 24, file.dataBytes.length, true);
    // File name length
    view.setUint16(offset + 28, file.nameBytes.length, true);
    // Extra field length
    view.setUint16(offset + 30, 0, true);
    // File comment length
    view.setUint16(offset + 32, 0, true);
    // Disk number start
    view.setUint16(offset + 34, 0, true);
    // Internal file attributes
    view.setUint16(offset + 36, 0, true);
    // External file attributes
    view.setUint32(offset + 38, 0, true);
    // Relative offset of local header
    view.setUint32(offset + 42, localOffset, true);

    offset += 46;
    buffer.set(file.nameBytes, offset);
    offset += file.nameBytes.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  // EOCD signature (0x06054b50)
  view.setUint32(offset, 0x06054b50, true);
  // Number of this disk
  view.setUint16(offset + 4, 0, true);
  // Disk where central directory starts
  view.setUint16(offset + 6, 0, true);
  // Number of central directory records on this disk
  view.setUint16(offset + 8, encodedFiles.length, true);
  // Total number of central directory records
  view.setUint16(offset + 10, encodedFiles.length, true);
  // Size of central directory
  view.setUint32(offset + 12, centralDirSize, true);
  // Offset of start of central directory
  view.setUint32(offset + 16, centralDirOffset, true);
  // Comment length
  view.setUint16(offset + 20, 0, true);

  return buffer;
}
