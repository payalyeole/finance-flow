package com.finance.backend.service;

import com.finance.backend.dto.request.LoginRequest;
import com.finance.backend.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
}
