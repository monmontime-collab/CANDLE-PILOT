import test from 'node:test';
import assert from 'node:assert/strict';
import { createZipArchive, crc32 } from './zipBuilder';

test('crc32 computes deterministic checksum', () => {
  const bytes = new TextEncoder().encode('hello world');
  const sum = crc32(bytes);
  assert.equal(sum, 0x0d4a1185);
});

test('createZipArchive produces valid PKZIP header and EOCD signature', () => {
  const zipBytes = createZipArchive([
    { path: 'Dockerfile', content: 'FROM alpine:3.19' },
    { path: 'docker-compose.yml', content: 'version: "3.8"' },
  ]);

  assert.ok(zipBytes.length > 100);
  // Check local file header 'PK\x03\x04'
  assert.equal(zipBytes[0], 0x50);
  assert.equal(zipBytes[1], 0x4b);
  assert.equal(zipBytes[2], 0x03);
  assert.equal(zipBytes[3], 0x04);

  // Check End of Central Directory 'PK\x05\x06' at end - 22
  const eocdIndex = zipBytes.length - 22;
  assert.equal(zipBytes[eocdIndex], 0x50);
  assert.equal(zipBytes[eocdIndex + 1], 0x4b);
  assert.equal(zipBytes[eocdIndex + 2], 0x05);
  assert.equal(zipBytes[eocdIndex + 3], 0x06);
});
