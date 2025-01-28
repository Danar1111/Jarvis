const fs = require('fs');
const path = require('path');

exports.handleAudioStream = (req, res) => {
    const audioFilePath = path.join(__dirname, '../uploads/streamed_audio.wav');
    const writeStream = fs.createWriteStream(audioFilePath);

    console.log("Receiving audio stream...");

    // Header RIFF untuk format .wav
    const writeWavHeader = (stream, sampleRate, bitsPerSample, channels) => {
        const byteRate = (sampleRate * bitsPerSample * channels) / 8;
        const blockAlign = (bitsPerSample * channels) / 8;

        const header = Buffer.alloc(44);
        header.write('RIFF', 0); // ChunkID
        header.writeUInt32LE(0, 4); // ChunkSize (akan diperbarui setelah selesai)
        header.write('WAVE', 8); // Format
        header.write('fmt ', 12); // Subchunk1ID
        header.writeUInt32LE(16, 16); // Subchunk1Size
        header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
        header.writeUInt16LE(channels, 22); // NumChannels
        header.writeUInt32LE(sampleRate, 24); // SampleRate
        header.writeUInt32LE(byteRate, 28); // ByteRate
        header.writeUInt16LE(blockAlign, 32); // BlockAlign
        header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
        header.write('data', 36); // Subchunk2ID
        header.writeUInt32LE(0, 40); // Subchunk2Size (akan diperbarui setelah selesai)

        stream.write(header);
    };

    // Tulis header RIFF untuk WAV file
    writeWavHeader(writeStream, 16000, 16, 1); // Contoh: 16kHz, 16-bit, mono

    let audioDataLength = 0;

    req.on('data', (chunk) => {
        console.log(`Received chunk of size: ${chunk.length}`);
        writeStream.write(chunk);
        audioDataLength += chunk.length;
    });

    req.on('end', () => {
        console.log("Audio stream complete.");

        // Perbarui header dengan ukuran data audio yang benar
        const fd = fs.openSync(audioFilePath, 'r+');
        const fileSize = 44 + audioDataLength;

        // Update file size and Subchunk2Size
        fs.writeSync(fd, Buffer.from([fileSize - 8, 0, 0, 0]), 4, 4, 4); // ChunkSize
        fs.writeSync(fd, Buffer.from([audioDataLength, 0, 0, 0]), 4, 4, 40); // Subchunk2Size
        fs.closeSync(fd);

        writeStream.end();

        res.status(200).json({ message: "Audio stream received successfully." });
    });

    req.on('error', (err) => {
        console.error("Error during audio streaming:", err);
        writeStream.end();
        res.status(500).json({ error: "Error during audio streaming." });
    });
};
