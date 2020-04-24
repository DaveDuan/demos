package com.davesmemo.backend.simpleserver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntity;

import javax.persistence.*;

/**
 * Date: 2020/2/26.
 * Time: 3:45 PM.
 *
 * @author David Duan
 */
@Entity
public class Tab extends PanacheEntity {
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false, updatable = true, insertable = true)
    public TabGroup group;
    public String title;
    @Column(columnDefinition = "VARCHAR(1000)")
    public String link;
    public Integer progress;
}
