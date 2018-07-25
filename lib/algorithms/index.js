const hash = require('./hash');
const crc = require('./crc');
const datetime = require('./datetime');
const size = require('./size');

const md5 = hash('md5');
const sha1 = hash('sha1');

const crc1 = crc('crc1')
const crc8 = crc('crc8')
const crc81wire = crc('crc81wire')
const crc16 = crc('crc16')
const crc16ccitt = crc('crc16ccitt')
const crc16modbus = crc('crc16modbus')
const crc16xmodem = crc('crc16xmodem')
const crc16kermit = crc('crc16kermit')
const crc24 = crc('crc24')
const crc32 = crc('crc32')

module.exports = {
    md5, sha1, datetime,
    crc1,
    crc8,
    crc81wire,
    crc16,
    crc16ccitt,
    crc16modbus,
    crc16xmodem,
    crc16kermit,
    crc24,
    crc32,
    size
};