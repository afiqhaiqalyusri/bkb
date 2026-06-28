package com.bkb.repository;

import com.bkb.entity.Advertisement;
import com.bkb.entity.enums.AdType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AdvertisementRepository extends JpaRepository<Advertisement, UUID> {
    
    @Query("SELECT a FROM Advertisement a WHERE a.isActive = true AND " +
           "(a.startDate IS NULL OR a.startDate <= :now) AND " +
           "(a.endDate IS NULL OR a.endDate >= :now) AND " +
           "a.targetPage = :targetPage " +
           "ORDER BY a.displayPriority ASC, a.createdAt DESC")
    List<Advertisement> findActiveByTargetPage(@Param("targetPage") String targetPage, @Param("now") LocalDateTime now);

    @Query("SELECT a FROM Advertisement a WHERE a.isActive = true AND " +
           "(a.startDate IS NULL OR a.startDate <= :now) AND " +
           "(a.endDate IS NULL OR a.endDate >= :now) " +
           "ORDER BY a.displayPriority ASC, a.createdAt DESC")
    List<Advertisement> findAllActive(@Param("now") LocalDateTime now);
    
    List<Advertisement> findAllByOrderByDisplayPriorityAscCreatedAtDesc();
}
