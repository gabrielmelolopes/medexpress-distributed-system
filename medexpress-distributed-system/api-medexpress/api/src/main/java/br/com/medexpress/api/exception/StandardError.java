package br.com.medexpress.api.exception;

import java.time.Instant;

public class StandardError {
    private Instant timestamp;
    private Integer status;
    private String error;
    private String message;
    private String path;

    public StandardError(Instant timestamp, Integer status, String error, String message, String path){
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    public String getPath() { return path; }
    public String getMessage() { return message; }
    public String getError() { return error; }
    public Integer getStatus() { return status; }
    public Instant getTimestamp() { return timestamp; }
}
