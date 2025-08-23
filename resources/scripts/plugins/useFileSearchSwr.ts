import useSWR from 'swr';
import { ServerContext } from '@/state/server';
import searchFiles, { type FileSearchResult } from '@/api/server/files/searchFiles';

export default function useFileSearchSwr(query: string) {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    return useSWR<FileSearchResult[]>(query ? `${uuid}:file_search:${query}` : null, () => searchFiles(uuid, query), {
        revalidateOnFocus: false,
        refreshInterval: 0,
        shouldRetryOnError: false,
    });
}
