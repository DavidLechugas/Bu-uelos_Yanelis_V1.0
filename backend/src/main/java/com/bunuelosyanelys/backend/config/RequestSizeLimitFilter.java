package com.bunuelosyanelys.backend.config;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

/** Limita el cuerpo a 256 KB (la foto de perfil, lo mayor, ronda los 140 KB), declarado o transmitido sin longitud. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestSizeLimitFilter extends OncePerRequestFilter {

    static final long MAX_BYTES = 256 * 1024;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        if (request.getContentLengthLong() > MAX_BYTES) {
            response.setStatus(413);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"La solicitud es demasiado grande.\"}");
            return;
        }
        chain.doFilter(new LimitedRequest(request), response);
    }

    private static final class LimitedRequest extends HttpServletRequestWrapper {

        LimitedRequest(HttpServletRequest request) {
            super(request);
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            ServletInputStream delegate = super.getInputStream();
            return new ServletInputStream() {
                private long read;

                private int count(int bytes) throws IOException {
                    if (bytes > 0 && (read += bytes) > MAX_BYTES) {
                        throw new IOException("Cuerpo de la solicitud demasiado grande");
                    }
                    return bytes;
                }

                @Override
                public int read() throws IOException {
                    int value = delegate.read();
                    if (value >= 0) {
                        count(1);
                    }
                    return value;
                }

                @Override
                public int read(byte[] buffer, int offset, int length) throws IOException {
                    return count(delegate.read(buffer, offset, length));
                }

                @Override
                public boolean isFinished() {
                    return delegate.isFinished();
                }

                @Override
                public boolean isReady() {
                    return delegate.isReady();
                }

                @Override
                public void setReadListener(ReadListener listener) {
                    delegate.setReadListener(listener);
                }
            };
        }
    }
}
