import React from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import useFileAnalyzerSwr from '@/plugins/useFileAnalyzerSwr';
import { useLocation } from 'react-router';
import { AnalyzeFileResponse } from '@/api/server/files/analyzeLogFile';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';

type Props = RequiredModalProps;

const LogResults = ({ result, i }: { result: AnalyzeFileResponse['attributes']; i: number }) => (
    <ul css={tw`divide-y divide-neutral-800`}>
        {result.issues.map((issue, idx) => (
            <li key={idx} css={tw`mb-4`}>
                <p css={tw`text-xs text-neutral-400`}>
                    {issue.timestamp ? new Date(Number(issue.timestamp) * 1000).toLocaleString() : 'No timestamp'} -{' '}
                    <span css={tw`font-bold`}>{issue.level.toUpperCase()}</span>
                </p>
                <p css={tw`mt-1`}>{issue.message}</p>
                {issue.solution && (
                    <p css={tw`mt-1 text-sm bg-neutral-800 p-2 rounded`}>
                        <span css={tw`font-bold`}>Suggested solution:</span> {issue.solution}
                    </p>
                )}
            </li>
        ))}
    </ul>
);

export default (props: Props) => {
    const { hash } = useLocation();
    const { data, isValidating } = useFileAnalyzerSwr(hash.replace(/^#/, ''));

    return (
        <Modal {...props}>
            <h2 css={tw`text-lg font-bold mb-2`}>Log Analyzer</h2>

            {isValidating && <Spinner centered size={'small'} css={tw`my-6`} />}
        
            {data && data.attributes.issues.length === 0 && <p css={tw`text-sm text-neutral-400`}>No issues found.</p>}

            {data && data.attributes.issues.length > 0 && <LogResults result={data.attributes} i={0} />}
        </Modal>
    );
};
