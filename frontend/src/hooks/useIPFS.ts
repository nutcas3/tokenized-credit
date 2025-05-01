import { useQuery } from '@tanstack/react-query';
import { ipfsAPI } from '../services/api';

export function useIPFS() {
  const useIPFSContent = (cid: string | undefined) => {
    return useQuery({
      queryKey: ['ipfs', cid],
      queryFn: () => ipfsAPI.getFromIPFS(cid!),
      enabled: !!cid,
    });
  };

  return {
    useIPFSContent,
  };
}
