package com.bkb.service;

import com.bkb.dto.request.AdvertisementRequest;
import com.bkb.dto.response.AdvertisementResponse;
import com.bkb.entity.Advertisement;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.AdvertisementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdvertisementService {

    private final AdvertisementRepository advertisementRepository;

    @Transactional(readOnly = true)
    public List<AdvertisementResponse> getAdvertisements(Boolean activeOnly, String targetPage) {
        List<Advertisement> ads;
        if (Boolean.TRUE.equals(activeOnly)) {
            LocalDateTime now = LocalDateTime.now();
            if (targetPage != null && !targetPage.isEmpty()) {
                ads = advertisementRepository.findActiveByTargetPage(targetPage, now);
            } else {
                ads = advertisementRepository.findAllActive(now);
            }
        } else {
            ads = advertisementRepository.findAllByOrderByDisplayPriorityAscCreatedAtDesc();
        }
        return ads.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public AdvertisementResponse createAdvertisement(AdvertisementRequest request) {
        Advertisement ad = Advertisement.builder()
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .imageUrl(request.getImageUrl())
                .targetPage(request.getTargetPage())
                .type(request.getType())
                .isActive(request.getIsActive())
                .displayPriority(request.getDisplayPriority() != null ? request.getDisplayPriority() : 0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();
        
        Advertisement savedAd = advertisementRepository.save(ad);
        return mapToResponse(savedAd);
    }

    @Transactional
    public AdvertisementResponse updateAdvertisement(UUID id, AdvertisementRequest request) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Advertisement not found with id: " + id));

        ad.setTitle(request.getTitle());
        ad.setSubtitle(request.getSubtitle());
        ad.setImageUrl(request.getImageUrl());
        ad.setTargetPage(request.getTargetPage());
        ad.setType(request.getType());
        ad.setIsActive(request.getIsActive());
        ad.setDisplayPriority(request.getDisplayPriority() != null ? request.getDisplayPriority() : 0);
        ad.setStartDate(request.getStartDate());
        ad.setEndDate(request.getEndDate());

        Advertisement updatedAd = advertisementRepository.save(ad);
        return mapToResponse(updatedAd);
    }

    @Transactional
    public void deleteAdvertisement(UUID id) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Advertisement not found with id: " + id));
        advertisementRepository.delete(ad);
    }

    private AdvertisementResponse mapToResponse(Advertisement ad) {
        return AdvertisementResponse.builder()
                .id(ad.getId())
                .title(ad.getTitle())
                .subtitle(ad.getSubtitle())
                .imageUrl(ad.getImageUrl())
                .targetPage(ad.getTargetPage())
                .type(ad.getType())
                .isActive(ad.getIsActive())
                .displayPriority(ad.getDisplayPriority())
                .startDate(ad.getStartDate())
                .endDate(ad.getEndDate())
                .createdAt(ad.getCreatedAt())
                .updatedAt(ad.getUpdatedAt())
                .build();
    }
}
