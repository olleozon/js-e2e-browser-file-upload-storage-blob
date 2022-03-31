// ./src/App.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from "react-to-print";
import Path from 'path';
import uploadFileToBlob, { isStorageConfigured, getBlobsList } from './azure-storage-blob';

const storageConfigured = isStorageConfigured();

const App = (): JSX.Element => {
  // all blobs in container
  const [blobList, setBlobList] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setBlobList(await getBlobsList());
    }
    fetchData();
  }, []);

  // current file to upload into container
  const [fileSelected, setFileSelected] = useState(null);

  // UI/form management
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const onFileChange = (event: any) => {
    // capture file into state
    setFileSelected(event.target.files[0]);
  };

  const onFileUpload = async () => {
    // prepare UI
    setUploading(true);

    // *** UPLOAD TO AZURE STORAGE ***
    const blobsInContainer: string[] = await uploadFileToBlob(fileSelected);

    // prepare UI for results
    setBlobList(blobsInContainer);

    // reset state/form
    setFileSelected(null);
    setUploading(false);
    setInputKey(Math.random().toString(36));
  };

  const componentRef = useRef(null);
  const onPrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // display form
  const DisplayForm = () => (
    <div>
      <input type="file" onChange={onFileChange} key={inputKey || ''} />
      <button type="submit" onClick={onFileUpload}>
        Upload
      </button>
      <button type="button" onClick={onPrint} style={{  marginLeft: "10px" }}>
        Print
      </button>
    </div>
  )
  
  // display file name and image
  const DisplayImagesFromContainer = () => (
    <div>
      <h2>Container items</h2>
      <ul>
        {blobList.map((item) => {
          return (
            <li key={item}>
              <div style={{ pageBreakInside: "avoid"}}>
                {Path.basename(item)}
                <br />
                <img src={item} alt={item} style={{ maxWidth: "700px" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div>
      <h1>Upload file to Azure Blob Storage</h1>
      {storageConfigured && !uploading && DisplayForm()}
      {storageConfigured && uploading && <div>Uploading</div>}
      <hr />
      <div ref={componentRef}>
      {storageConfigured && blobList.length > 0 && DisplayImagesFromContainer()}
      </div>
      {!storageConfigured && <div>Storage is not configured.</div>}
    </div>
  );
};

export default App;


