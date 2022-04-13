// ./src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import axios from 'axios'
import { Alert, Button, InputGroup, Form } from 'react-bootstrap';
import { useReactToPrint } from "react-to-print";
import uploadFileToBlob, { getBlobsList } from './azure-storage-blob';

const App = (): JSX.Element => {
  // all blobs in container
  const [blobList, setBlobList] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);
  const [addedData, setAddedData] = useState<any>(null);
  const [attachment, setAttachment] = useState<string>("");
  const [storageUrl, setStorageUrl] = useState<URL | null>(null); // JSON data blob storage url with sas token querystring
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const storageConfigured = (): boolean => {
    return (storageUrl != null);
  };
  
  useEffect(() => {
    const jsonPath = new URLSearchParams(window.location.search).get('j');
    if (jsonPath) {
      const jsonUrl = new URL(jsonPath);
      if (jsonUrl) {
        setStorageUrl(jsonUrl);
        axios.get(jsonPath)
        .then(response => {
            console.log(response.data);
            setData(response.data);
            if (response.data.MREC_Id) setAddedData({"MREC_Id": response.data.MREC_Id, "sas": jsonUrl.search });
            if (response.data.INFO_PathFile) setAttachment(response.data.INFO_PathFile);
            // Test: Show pictures in blob 
            const fetchList = async () => {
              setBlobList(await getBlobsList(jsonUrl));
            }
            fetchList();
        })
        .catch(error => setError(error.toString())
        );
      }
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

  const onShow = (e: any) => {
    if (attachment.length > 0) window.open(attachment, "_blank");
  }

  const onSave = async (e: any) => {
    e.preventDefault();
    if (addedData && addedData.MREC_Id && addedData.sas) {
      console.log(addedData);
      // await axios.post(postTarget, addedData); // Needs CORS configuration
      const aFile = new File([JSON.stringify(addedData)], 'arec-' + addedData.MREC_Id + '-answer.json', {type: 'application/json'});
      await uploadFileToBlob(aFile, storageUrl);
      const mFile = new File([JSON.stringify(data)], 'mrec-' + addedData.MREC_Id + '.json', {type: 'application/json'});
      await uploadFileToBlob(mFile, storageUrl);
      setSuccess("Thank you for sending your response!");
    }
  }

  const onFormChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
    setData({ ...data, [name]: value });
    setAddedData((addedData: any) =>({ ...addedData, ...{[name]: value} }));
  }

  const onFileUpload = async () => {
    if (storageConfigured()) {
      setUploading(true); // prepare UI
      const attachment: string = await uploadFileToBlob(fileSelected, storageUrl);
      if (attachment.length > 0) {
        setAttachment(attachment);
        setData({ ...data, "INFO_PathFile": attachment });
        setAddedData((addedData: any) =>({ ...addedData, ...{"INFO_PathFile": attachment} }));
      }
      // prepare UI for results
      setBlobList(await getBlobsList(storageUrl));
      // reset state/form
      setFileSelected(null);
      setUploading(false);
      setInputKey(Math.random().toString(36));
    }
  };

  const componentRef = useRef(null);
  const onPrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const isImageUrl = (url :string) :boolean => {
    const urlNoQuery :string = (url.indexOf('?') > 0) ? url.substring(0, url.indexOf('?')) : url;
    return (urlNoQuery.match(/\w+\.(jpg|jpeg|gif|png)$/gi) != null);
  };

  // display form
  const DisplayForm = () => (
    <div>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Audit type</Form.Label>
          <Form.Control as="input" type="input" disabled value={data && data.REVI_Typ} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Extent/Scope</Form.Label>
          <Form.Control as="textarea" disabled value={data && data.REVI_Memo} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Verification</Form.Label>
          <Form.Control as="textarea" name="REVI_Verifiering" value={data && data.REVI_Verifiering} onChange={onFormChange} />
          <Button variant="outline-secondary" type="submit" onClick={onSave}>Save</Button>
        </Form.Group>
        <Form.Group className="mb-3">
          <InputGroup className="mb-3">
            <InputGroup.Text>Attachment</InputGroup.Text>
            <Form.Control as="input" name="INFO_PathFile" value={attachment} onChange={onFormChange} />
            <Button variant="outline-secondary" type="button" onClick={onShow}>Show</Button>
            <Form.Control type="file" onChange={onFileChange} key={inputKey || ''} />
            <Button variant="outline-secondary" onClick={onFileUpload}>Upload</Button>
            <Button variant="outline-secondary" onClick={onPrint}>Print</Button>
          </InputGroup>
        </Form.Group>
{/*    
        <Form.Group className="mb-3">
          <InputGroup className="mb-3">
            <InputGroup.Text>Klart datum</InputGroup.Text>
            <Form.Control type="date" name="RANM_KlartDatum" value={data && data.RANM_KlartDatum} onChange={onFormChange} />
            <InputGroup.Text>Signatur</InputGroup.Text>
            <Form.Control as="input" name="RANM_Signatur" value={data && data.RANM_Signatur} onChange={onFormChange} />
          </InputGroup>
        </Form.Group>
 */}      
      </Form>
    </div>
  )
  
  // display file name and image
  const DisplayImagesFromContainer = () => (
    <div>
      <h2>Attachments</h2>
      <ul>
        {blobList.map((item) => {
          return (
            <li key={item}>
              <div style={{ pageBreakInside: "avoid"}}>
                {new URL(item).pathname}
                <br />
                {isImageUrl(item) && <img src={item} alt={item} style={{ maxWidth: "700px" }} />}
                {!isImageUrl(item) && <a target='_blank' rel='noreferrer' href={item}>Dokument</a>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div style={{padding: "10px"}}>
      <h1>Verifying revision {data && data.REVI_Id} </h1>
      {error.length > 0 && <Alert variant="danger">{error}</Alert>}
      {success.length > 0 && <Alert variant="info">{success}</Alert>}
      {storageConfigured() && !uploading && DisplayForm()}
      {storageConfigured() && uploading && <div>Uploading</div>}
      <hr />
      <div ref={componentRef}>
      {storageConfigured() && blobList.length > 0 && DisplayImagesFromContainer()}
      </div>
      {!storageConfigured && <div>Storage is not configured.</div>}
    </div>
  );
};

export default App;