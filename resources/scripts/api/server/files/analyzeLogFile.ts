import http from '@/api/http';

export interface AnalyzeFileResponse {
    object: string;
    attributes: {
        file_path: string;
        log_type: string;
        detected_format: string;
        total_issues: number;
        total_information: number;
        issues: {
            type: string;
            level: string;
            message: string;
            solution: string;
            timestamp: string | null;
        }[];
        information: {
            type: string;
            message: string;
            value: string;
        }[];
    };
}

export default async (uuid: string, filePath: string): Promise<AnalyzeFileResponse> => {
    const response = await http.get(`/api/client/servers/${uuid}/files/analyze`, {
        params: {
            file: filePath,
        },
    });

    return response.data;
};
