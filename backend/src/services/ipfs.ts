import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// IPFS service for uploading and retrieving data
export const uploadToIPFS = async (data: any): Promise<string> => {
  try {
    // Check for API keys
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
    
    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys not found in environment variables');
    }
    
    // Prepare metadata
    const metadata = JSON.stringify({
      name: `Loan Application Data - ${Date.now()}`,
      keyvalues: {
        timestamp: Date.now().toString(),
        type: 'loan_application'
      }
    });
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
          'pinata_metadata': metadata
        }
      }
    );
    
    // Return IPFS hash
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload data to IPFS');
  }
};

export const getFromIPFS = async (ipfsHash: string): Promise<any> => {
  try {
    // Fetch data from IPFS gateway
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error('Failed to retrieve data from IPFS');
  }
};
