import http from '@/api/http';

export interface FileSearchResult {
    object: string;
    attributes: {
        file: string;
        line: number;
        snippet: string;
    };
}

export default async (uuid: string, query: string): Promise<FileSearchResult[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/search`, {
        params: { query },
    });

    return data.data;
};
