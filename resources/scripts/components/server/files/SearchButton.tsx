import React, { useState } from 'react';
import Button from '@/components/elements/Button';
import SearchFileModal from '@/components/dashboard/search/SearchFilesModal';

export default () => {
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <>
            <Button onClick={() => setVisible(true)}>Search Files</Button>
            {visible && <SearchFileModal visible={visible} onDismissed={() => setVisible(false)} />}
        </>
    );
};
