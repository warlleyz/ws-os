
import { useContext } from 'react';
import { WallyConversationContext } from './wallyConversationContext';

export default function useSharedWallyConversation() {
    const conversation = useContext(WallyConversationContext);

    if (!conversation) {
        throw new Error(
            'WallyConversationProvider não encontrado.',
        );
    }

    return conversation;
}
