package com.projeto.logistica.exception;

public class NegocioException extends RuntimeException{
    public NegocioException(String message){
        super(message);
    }
}
