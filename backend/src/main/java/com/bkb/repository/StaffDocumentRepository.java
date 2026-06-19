package com.bkb.repository;

import com.bkb.entity.StaffDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffDocumentRepository extends JpaRepository<StaffDocument, Long> {
    Optional<StaffDocument> findByUserId(Long userId);
}
