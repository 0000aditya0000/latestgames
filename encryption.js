const CryptoJS = require("crypto-js");
require("dotenv").config();

const AES_KEY = process.env.AES_KEY;

function encrypt(data) {
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        key,
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    );
    return encrypted.toString();
}

function decrypt(cipherText) {
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) throw new Error("Decrypt failed");

    return JSON.parse(decrypted);
}

module.exports = { encrypt, decrypt };
