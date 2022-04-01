// ./src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import axios from 'axios'
import { Button, InputGroup, Form } from 'react-bootstrap';
import { useReactToPrint } from "react-to-print";
import Path from 'path';
import uploadFileToBlob, { isStorageConfigured, getBlobsList } from './azure-storage-blob';

const storageConfigured = isStorageConfigured();

const App = (): JSX.Element => {
  // all blobs in container
  const [blobList, setBlobList] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);
  const [addedData, setAddedData] = useState<any>(null);

  useEffect(() => {
    const fetchList = async () => {
      setBlobList(await getBlobsList());
    }
    fetchList();

    const urlParams = new URLSearchParams(window.location.search);
    const jsonPath = urlParams.get('j');
    const jsonKey = urlParams.get('k');
    if (jsonPath && jsonPath.length > 0 && jsonKey && jsonKey.length > 0) {
      axios.get(jsonPath + jsonKey)
      .then(response => {
          console.log(response.data);
          setData(response.data);
          if (response.data.MREC_Id) setAddedData({"MREC_Id": response.data.MREC_Id });
      });
    }
  }, []);

  // current file to upload into container
  const [fileSelected, setFileSelected] = useState(null);

  // UI/form management
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const onFileChange = (event: any) => {
    setFileSelected(event.target.files[0]); // capture file into state
  };

  const onSave = async (e: any) => {
    e.preventDefault();
    console.log(addedData);
  }

  const onFormChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
    setData({ ...data, [name]: value });
    setAddedData({ ...addedData, [name]: value });
  }

  const onFileUpload = async () => {
    setUploading(true); // prepare UI
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
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Anmärkningstyp</Form.Label>
          <Form.Control disabled value={data && data.REVI_Typ} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Anmärkning</Form.Label>
          <Form.Control as="textarea" disabled value={data && data.REVI_Memo} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Korrigerande åtgärd</Form.Label>
          <Form.Control as="textarea" name="RANM_Korrigering" value={data && data.RANM_Korrigering} onChange={onFormChange} />
        </Form.Group>
        <Form.Group className="mb-3">
        <InputGroup className="mb-3">
          <InputGroup.Text>Signatur</InputGroup.Text>
          <Form.Control as="input" name="RANM_Signatur" value={data && data.RANM_Signatur} onChange={onFormChange} />
          <Button variant="outline-secondary" type="submit" onClick={onSave}>Spara</Button>
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3">
          <InputGroup className="mb-3">
            <InputGroup.Text>Bilaga</InputGroup.Text>
            <Form.Control type="file" onChange={onFileChange} key={inputKey || ''} />
            <Button variant="outline-secondary" onClick={onFileUpload}>Ladda upp</Button>
            <Button variant="outline-secondary" onClick={onPrint}>Skriv ut</Button>
          </InputGroup>
        </Form.Group>
      </Form>
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
    <div style={{padding: "10px"}}>
      <h1>Korrigering revisionsanmärkning {data && data.REVI_Id} </h1>
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


