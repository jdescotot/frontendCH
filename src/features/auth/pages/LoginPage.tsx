import React, { useState } from "react";
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () =>{
    const[usuario, setusuario] = useState('');
    const[password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (usuario === 'admin' && password === '1234') {
            alert('¡Login correcto! Conectando al sistema...');
        } else {
            alert('Usuario o contraseña incorrectos (Prueba con admin / 1234)');
        }
    };

    return(
        <div className="container mt-5">
            <h2 className="mb-4 text-center">Control Horario</h2>
        </div>
    );
}; export default LoginPage;