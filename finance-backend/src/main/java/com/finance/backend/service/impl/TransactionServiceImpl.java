package com.finance.backend.service.impl;

import com.finance.backend.dto.request.TransactionRequest;
import com.finance.backend.dto.response.TransactionResponse;
import com.finance.backend.entity.Transaction;
import com.finance.backend.entity.User;
import com.finance.backend.enums.TransactionType;
import com.finance.backend.exception.ResourceNotFoundException;
import com.finance.backend.repository.TransactionRepository;
import com.finance.backend.repository.UserRepository;
import com.finance.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Override
    public TransactionResponse create(TransactionRequest request, String username) {
        User user = findUserOrThrow(username);

        Transaction transaction = Transaction.builder()
                .amount(request.getAmount())
                .type(request.getType())
                .category(request.getCategory().trim())
                .date(request.getDate())
                .notes(request.getNotes())
                .createdBy(user)
                .deleted(false)
                .build();

        return toResponse(transactionRepository.save(transaction));
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getById(Long id) {
        return toResponse(findTransactionOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAll(TransactionType type, String category,
                                             LocalDate from, LocalDate to, Pageable pageable) {
        return transactionRepository
                .findAllWithFilters(type, category, from, to, pageable)
                .map(this::toResponse);
    }

    @Override
    public TransactionResponse update(Long id, TransactionRequest request, String username) {
        Transaction transaction = findTransactionOrThrow(id);

        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setCategory(request.getCategory().trim());
        transaction.setDate(request.getDate());
        transaction.setNotes(request.getNotes());

        return toResponse(transactionRepository.save(transaction));
    }

    @Override
    public void delete(Long id) {
        Transaction transaction = findTransactionOrThrow(id);
        transaction.setDeleted(true); // soft delete
        transactionRepository.save(transaction);
    }

    // --- Helpers ---

    private Transaction findTransactionOrThrow(Long id) {
        return transactionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
    }

    private User findUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .type(t.getType())
                .category(t.getCategory())
                .date(t.getDate())
                .notes(t.getNotes())
                .createdBy(t.getCreatedBy().getUsername())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
