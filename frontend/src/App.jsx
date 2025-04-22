
import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);

    setLoading(true);
    setProgress(30);
    setDownloadLink(null);

    try {
      const response = await axios.post('http://localhost:3020/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProgress(100);
      setDownloadLink('http://localhost:3020' + response.data.url);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Audio Transcription</h1>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="block"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Transcribe
      </button>
      {loading && (
        <div className="w-full max-w-md bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: progress + '%' }}
          />
        </div>
      )}
      {downloadLink && (
        <a
          href={downloadLink}
          target="_blank"
          className="text-blue-600 underline"
        >
          Download Transcription
        </a>
      )}
    </div>
  );
}
