import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import { debounce } from 'debounce';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import Input from '@/components/elements/Input';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import SearchFiles, { FileSearchResult } from '@/api/server/files/searchFiles';
import { ServerContext } from '@/state/server';

type Props = RequiredModalProps;

interface Values {
    search: string;
}

const SearchWatcher = () => {
    const { values, submitForm } = useFormikContext<Values>();

    useEffect(() => {
        if (values.search.length >= 3) {
            submitForm();
        }
    }, [values.search]);

    return null;
};

export default (props: Props) => {
    const ref = useRef<HTMLInputElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FileSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const performSearch = debounce(async (values: { search: string }) => {
        const query = values.search.trim();

        if (query.length) {
            setQuery(query);
        }

        try {
            setIsLoading(true);
            const searchResults = await SearchFiles(uuid, query);
            setResults(searchResults);
        } catch (error) {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    const InputWithRef = (props: any) => <Input autoFocus {...props} ref={ref} />;

    return (
        <Formik initialValues={{ search: '' }} onSubmit={performSearch}>
            <Modal visible={props.visible} onDismissed={props.onDismissed} closeOnEscape closeOnBackground>
                <Form>
                    <h2 css={tw`text-lg font-bold mb-2`}>Search Files & Content</h2>
                    <FormikFieldWrapper name='search' label='Enter a search term to search files and content'>
                        <SearchWatcher />
                        <Field as={InputWithRef} name='search' />
                    </FormikFieldWrapper>
                </Form>

                {isLoading && <Spinner centered size='small' />}

                <ul css={tw`space-y-2 max-h-96 overflow-y-auto text-sm mt-6`}>
                    {results?.map((res, i) => {
                        const { file, line, snippet } = res.attributes;
                        return (
                            <li key={i} css={tw`p-2 rounded bg-neutral-900 text-neutral-100`}>
                                <p css={tw`text-xs text-neutral-400`}>
                                    {file} — line {line}
                                </p>
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: snippet.replace(
                                            new RegExp(query, 'gi'),
                                            (match) => `<mark class="bg-yellow-400 text-black">${match}</mark>`
                                        ),
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </Modal>
        </Formik>
    );
};
