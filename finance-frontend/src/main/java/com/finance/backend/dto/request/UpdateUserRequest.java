package com.finance.backend.dto.request;

import com.finance.backend.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Email(message = "Invalid email format")
    private String email;

    @Size(max = 100)
    private String fullName;

    private Role role;

    private Boolean active;
}
