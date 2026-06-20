package com.bkb.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "store_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSetting {

    @Id
    @Column(name = "setting_key", nullable = false, unique = true)
    private String settingKey;

    @Column(name = "setting_value")
    private String settingValue;

    @Column(name = "description")
    private String description;
}
