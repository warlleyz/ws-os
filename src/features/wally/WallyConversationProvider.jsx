
import useWallyConversation from './useWallyConversation';
import { WallyConversationContext } from './wallyConversationContext';

export default function WallyConversationProvider({ children }) {
    const conversation = useWallyConversation();

    return (
        <WallyConversationContext.Provider value={conversation}>
            {children}
        </WallyConversationContext.Provider>
    );
}
