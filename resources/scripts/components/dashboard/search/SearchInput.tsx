import React from 'react';
import { Formik, Form, Field } from 'formik';
import useFileSearchSwr from '@/plugins/useFileSearchSwr';
import Button from '@/components/elements/Button';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';

export default () => {
    const [search, setSearch] = React.useState('');
    const [showModal, setShowModal] = React.useState(false);
    const { data: results, isValidating } = useFileSearchSwr(search);

    const handleSearch = (values: { search: string }) => {
        const query = values.search.trim();
        if (query.length > 0) {
            setSearch(query);
            setShowModal(true);
        }
    };

    return (
        <div css={tw`flex justify-between items-center mb-4`}>
            <Formik initialValues={{ search: '' }} onSubmit={handleSearch}>
                <Form css={tw`flex w-full max-w-sm`}>
                    <Field
                        type='text'
                        name='search'
                        placeholder='Search file ...'
                        css={tw`flex-grow px-3 py-2 border rounded-l-md text-sm`}
                    />
                    <Button type='submit' css={tw`rounded-l-none`}>
                        Search
                    </Button>
                </Form>
            </Formik>
            <Modal visible={showModal} onDismissed={() => setShowModal(false)} closeOnEscape closeOnBackground>
                <h2 css={tw`text-lg font-bold mb-2`}>Search Results</h2>

                {isValidating && <Spinner centered />}
                {!isValidating && results && results.length === 0 && (
                    <p css={tw`text-sm text-neutral-400`}>No matches found.</p>
                )}

                <ul css={tw`space-y-2 max-h-96 overflow-y-auto text-sm`}>
                    {results?.map((res, i) => {
                        const { file, line, snippet } = res.attributes;
                        return (
                            <li key={i} css={tw`p-2 rounded bg-neutral-800 text-neutral-100`}>
                                <p css={tw`text-xs text-neutral-400`}>
                                    {file} — line {line}
                                </p>
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: snippet.replace(
                                            new RegExp(search, 'gi'),
                                            (match) => `<mark class="bg-yellow-400 text-black">${match}</mark>`
                                        ),
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </Modal>
        </div>
    );
};
