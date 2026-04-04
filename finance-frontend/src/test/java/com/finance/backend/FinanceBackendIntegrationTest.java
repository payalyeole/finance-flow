package com.finance.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.backend.dto.request.LoginRequest;
import com.finance.backend.dto.request.TransactionRequest;
import com.finance.backend.entity.User;
import com.finance.backend.enums.Role;
import com.finance.backend.enums.TransactionType;
import com.finance.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class FinanceBackendIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String adminToken;
    private String analystToken;
    private String viewerToken;

    @BeforeEach
    void setUp() throws Exception {
        // Tokens are seeded by DataSeeder; just login to get them
        adminToken   = loginAndGetToken("admin",   "admin123");
        analystToken = loginAndGetToken("analyst", "analyst123");
        viewerToken  = loginAndGetToken("viewer",  "viewer123");
    }

    // ---- Auth ----

    @Test
    void login_withValidCredentials_returnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("admin", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    void login_withInvalidCredentials_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("admin", "wrongpass"))))
                .andExpect(status().isUnauthorized());
    }

    // ---- Access Control ----

    @Test
    void viewer_cannotCreateTransaction() throws Exception {
        mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + viewerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validTransactionRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void analyst_canCreateTransaction() throws Exception {
        mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + analystToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validTransactionRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.category").value("Salary"));
    }

    @Test
    void viewer_cannotDeleteTransaction() throws Exception {
        mockMvc.perform(delete("/api/transactions/1")
                .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void analyst_cannotDeleteTransaction() throws Exception {
        mockMvc.perform(delete("/api/transactions/1")
                .header("Authorization", "Bearer " + analystToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_canDeleteTransaction() throws Exception {
        // Create one first
        MvcResult result = mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validTransactionRequest())))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        Long id = objectMapper.readTree(body).get("data").get("id").asLong();

        mockMvc.perform(delete("/api/transactions/" + id)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void viewer_cannotManageUsers() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_canManageUsers() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    // ---- Dashboard ----

    @Test
    void allRoles_canAccessDashboard() throws Exception {
        for (String token : new String[]{adminToken, analystToken, viewerToken}) {
            mockMvc.perform(get("/api/dashboard/summary")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalIncome").exists())
                    .andExpect(jsonPath("$.data.totalExpenses").exists())
                    .andExpect(jsonPath("$.data.netBalance").exists());
        }
    }

    // ---- Validation ----

    @Test
    void createTransaction_withMissingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.amount").exists());
    }

    @Test
    void unauthenticated_request_returns401or403() throws Exception {
        mockMvc.perform(get("/api/transactions"))
                .andExpect(result ->
                        org.junit.jupiter.api.Assertions.assertTrue(
                                result.getResponse().getStatus() == 401 ||
                                result.getResponse().getStatus() == 403
                        ));
    }

    // ---- Helpers ----

    private String loginAndGetToken(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(username, password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data").get("token").asText();
    }

    private TransactionRequest validTransactionRequest() {
        TransactionRequest req = new TransactionRequest();
        req.setAmount(BigDecimal.valueOf(1000));
        req.setType(TransactionType.INCOME);
        req.setCategory("Salary");
        req.setDate(LocalDate.now());
        req.setNotes("Test transaction");
        return req;
    }
}
