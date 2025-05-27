import React, { createContext, useContext, useState } from 'react';

const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const triggerUpdate = () => {
        setUpdateTrigger(prev => prev + 1);
    };

    return (
        <UpdateContext.Provider value={{ updateTrigger, triggerUpdate }}>
            {children}
        </UpdateContext.Provider>
    );
};

export const useUpdate = () => useContext(UpdateContext);