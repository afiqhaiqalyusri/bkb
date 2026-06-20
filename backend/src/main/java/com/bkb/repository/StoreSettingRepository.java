package com.bkb.repository;

import com.bkb.entity.StoreSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreSettingRepository extends JpaRepository<StoreSetting, String> {
}
