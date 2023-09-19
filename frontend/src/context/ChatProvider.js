import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const ChatContext = createContext();

const ChatProvider = ({ children }) => {

    const navigate = useNavigate();

    const [user, setUser] = useState();
  
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUser(userInfo);

        if (!userInfo) {
            navigate('/')
        }

    }, [navigate]); // 경로 변경이 될 때마다 userInfo를 확인. userInfo가 없으면 홈으로 이동

    return ( // index.js에서 ChatProvider로 감싸진 모든 컴포넌트들이 children이 된다.
        <ChatContext.Provider value={{ user, setUser }}>
            {children}
        </ChatContext.Provider>
    )
}

export const ChatState = () => {
    return useContext(ChatContext);
}

export default ChatProvider;