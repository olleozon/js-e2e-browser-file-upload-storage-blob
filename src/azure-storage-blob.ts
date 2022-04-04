// ./src/azure-storage-blob.ts

// <snippet_package>
// THIS IS SAMPLE CODE ONLY - NOT MEANT FOR PRODUCTION USE
import { BlobServiceClient, ContainerClient} from '@azure/storage-blob';

const getBlobAccess = (blobUrl: URL | null): { [key: string]: string } => {
  if (!blobUrl) return {};
  const containerName: string = (blobUrl != null && blobUrl.pathname.split('/').length > 1)? blobUrl.pathname.split('/')[1] : '';
  const blobAccess: { [key: string]: string } = { storageHost: blobUrl.hostname, containerName: containerName, sasToken: blobUrl.search };
  return blobAccess;
}

const createContainerClient = async (blobUrl: URL | null) => {
  const blobAccess = getBlobAccess(blobUrl);
  // get BlobService = notice `?` is pulled out of sasToken - if created in Azure portal
  const blobService = new BlobServiceClient(
    `https://${blobAccess.storageHost}/${blobAccess.sasToken}`
  );
  const containerClient: ContainerClient = blobService.getContainerClient(blobAccess.containerName);
  /*
  await containerClient.createIfNotExists({
    access: 'container',
  });
  */
  return containerClient;
}

// <snippet_getBlobsInContainer>
// return list of blobs in container to display
const getBlobsInContainer = async (containerClient: ContainerClient, blobUrl: URL | null) => {
  const returnedBlobUrls: string[] = [];
  const blobAccess = getBlobAccess(blobUrl);

  // get list of blobs in container
  // eslint-disable-next-line
  for await (const blob of containerClient.listBlobsFlat()) {
    // if image is public, just construct URL
    if (!(blob.name.toLowerCase().endsWith('.json'))) returnedBlobUrls.push(`https://${blobAccess.storageHost}/${blobAccess.containerName}/${blob.name}${blobAccess.sasToken}`);
  }

  return returnedBlobUrls;
}
// </snippet_getBlobsInContainer>

// <snippet_createBlobInContainer>
const createBlobInContainer = async (containerClient: ContainerClient, file: File) => {
  const blobClient = containerClient.getBlockBlobClient(file.name);
  // Set mimetype as determined from browser with file upload control
  const options = { blobHTTPHeaders: { blobContentType: file.type } };
  await blobClient.uploadData(file, options); // upload file
}
// </snippet_createBlobInContainer>


export const getBlobsList = async (blobUrl: URL | null): Promise<string[]> => {
  const containerClient = await createContainerClient(blobUrl);
  return getBlobsInContainer(containerClient, blobUrl);
}

// <snippet_uploadFileToBlob>
const uploadFileToBlob = async (file: File | null, blobUrl: URL | null): Promise<string[]> => {
  if (!file) return [];
  const containerClient = await createContainerClient(blobUrl);
  await createBlobInContainer(containerClient, file); // upload file
  return getBlobsInContainer(containerClient, blobUrl); // get list of blobs in container
};
// </snippet_uploadFileToBlob>

export default uploadFileToBlob;
