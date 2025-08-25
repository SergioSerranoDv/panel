import useSWR from 'swr';
import { ServerContext } from '@/state/server';
import analyzeLogFile, { type AnalyzeFileResponse } from '@/api/server/files/analyzeLogFile';

export default function useFileAnalyzerSwr(filePath: string) {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    return useSWR<AnalyzeFileResponse>(filePath ? `${uuid}:file_analyze:${filePath}` : null, () => analyzeLogFile(uuid, filePath), {
        revalidateOnFocus: false,
        refreshInterval: 0,
        shouldRetryOnError: false,
    });
}
