package com.finance.backend.dto.response;

import com.finance.backend.enums.Role;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private String username;
    private Role role;
    private String fullName;
}
