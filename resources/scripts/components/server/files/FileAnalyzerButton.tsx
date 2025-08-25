import React, { useState } from 'react';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import LogAnalyzer from './LogAnalyzer';

export default () => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <>
            <Button css={tw`ml-4 bg-gray-600 border-gray-600`} onClick={() => setModalVisible(true)}>
                Analyze file
            </Button>
            {modalVisible && <LogAnalyzer visible={modalVisible} onDismissed={() => setModalVisible(false)} />}
        </>
    );
};
