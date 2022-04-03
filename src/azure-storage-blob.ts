// ./src/azure-storage-blob.ts

// <snippet_package>
// THIS IS SAMPLE CODE ONLY - NOT MEANT FOR PRODUCTION USE
import { BlobServiceClient, ContainerClient} from '@azure/storage-blob';

const containerName = `tutorial-container`;
const sasToken = process.env.REACT_APP_STORAGESASTOKEN;
const storageAccountName = process.env.REACT_APP_STORAGERESOURCENAME;
const storageHost = `${storageAccountName}.blob.core.windows.net`;
// </snippet_package>

// <snippet_isStorageConfigured>
// Feature flag - disable storage feature to app if not configured
export const isStorageConfigured = () => {
  return (!storageAccountName || !sasToken) ? false : true;
}
// </snippet_isStorageConfigured>

// <snippet_getBlobsInContainer>
// return list of blobs in container to display
const getBlobsInContainer = async (containerClient: ContainerClient, storageHost: string, containerName: string, sasToken: string) => {
  const returnedBlobUrls: string[] = [];

  // get list of blobs in container
  // eslint-disable-next-line
  for await (const blob of containerClient.listBlobsFlat()) {
    // if image is public, just construct URL
    if (!(blob.name.toLowerCase().endsWith(".json"))) returnedBlobUrls.push(`https://${storageHost}/${containerName}/${blob.name}${sasToken}`);
  }

  return returnedBlobUrls;
}
// </snippet_getBlobsInContainer>

// <snippet_createBlobInContainer>
const createBlobInContainer = async (containerClient: ContainerClient, file: File) => {
  
  // create blobClient for container
  const blobClient = containerClient.getBlockBlobClient(file.name);

  // set mimetype as determined from browser with file upload control
  const options = { blobHTTPHeaders: { blobContentType: file.type } };

  // upload file
  await blobClient.uploadData(file, options);
}
// </snippet_createBlobInContainer>

export const getBlobsList = async (storageHost: string, containerName: string, sasToken: string): Promise<string[]> => {
  // get BlobService = notice `?` is pulled out of sasToken - if created in Azure portal
  const blobService = new BlobServiceClient(
    `https://${storageHost}/${sasToken}`
  );

  // get Container - full public read access
  const containerClient: ContainerClient = blobService.getContainerClient(containerName);
  // await containerClient.createIfNotExists({
  //   access: 'container',
  // });
  return getBlobsInContainer(containerClient, storageHost, containerName, sasToken);
}

// <snippet_uploadFileToBlob>
const uploadFileToBlob = async (file: File | null, storageHost: string, containerName: string, sasToken: string): Promise<string[]> => {
  if (!file) return [];

  // get BlobService = notice `?` is pulled out of sasToken - if created in Azure portal
  const blobService = new BlobServiceClient(
    `https://${storageHost}/${sasToken}`
  );

  // get Container - full public read access
  const containerClient: ContainerClient = blobService.getContainerClient(containerName);
  /*
  await containerClient.createIfNotExists({
    access: 'container',
  });
  */

  // upload file
  await createBlobInContainer(containerClient, file);

  // get list of blobs in container
  return getBlobsInContainer(containerClient, storageHost, containerName, sasToken);
};
// </snippet_uploadFileToBlob>

export default uploadFileToBlob;
