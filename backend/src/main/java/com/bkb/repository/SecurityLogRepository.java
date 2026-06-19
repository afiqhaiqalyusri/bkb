package com.bkb.repository;

import com.bkb.entity.SecurityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {
    Page<SecurityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
