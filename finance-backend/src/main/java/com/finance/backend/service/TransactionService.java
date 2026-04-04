package com.finance.backend.service;

import com.finance.backend.dto.request.TransactionRequest;
import com.finance.backend.dto.response.TransactionResponse;
import com.finance.backend.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface TransactionService {
    TransactionResponse create(TransactionRequest request, String username);
    TransactionResponse getById(Long id);
    Page<TransactionResponse> getAll(TransactionType type, String category,
                                     LocalDate from, LocalDate to, Pageable pageable);
    TransactionResponse update(Long id, TransactionRequest request, String username);
    void delete(Long id);
}
