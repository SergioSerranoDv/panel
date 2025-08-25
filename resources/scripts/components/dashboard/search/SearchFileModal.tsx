import React, { useState, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Button from '@/components/elements/Button';
import InputSpinner from '@/components/elements/InputSpinner';
import useFileSearchSwr from '@/plugins/useFileSearchSwr';

type Props = RequiredModalProps;

export default (props: Props) => {
    const ref = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const { data: results, isValidating } = useFileSearchSwr(query);

    const performSearch = async (values: { search: string }) => {
        const query = values.search.trim();

        if (query.length) {
            setQuery(query);
        }
    };

    const InputWithRef = (props: any) => <Input autoFocus {...props} ref={ref} />;

    return (
        <Formik initialValues={{ search: '' }} onSubmit={performSearch}>
            <Modal visible={props.visible} onDismissed={props.onDismissed} closeOnEscape closeOnBackground>
                <Form>
                    <h2 css={tw`text-lg font-bold mb-2`}>Search Files & Content</h2>
                    <FormikFieldWrapper name='search' label='Enter a search term to search files and content'>
                        <InputSpinner visible={isValidating}>
                            <Field as={InputWithRef} name={'search'} />
                        </InputSpinner>
                    </FormikFieldWrapper>

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

                    <div css={tw`mt-4 flex justify-end`}>
                        {/* diferent colot for close button #606d7b */}
                        <Button css={tw`bg-gray-600 border-gray-600`} onClick={props.onDismissed}>
                            Close
                        </Button>
                        <Button type='submit' css={tw`ml-2`} disabled={isValidating}>
                            Search
                        </Button>
                    </div>
                </Form>
            </Modal>
        </Formik>
    );
};
