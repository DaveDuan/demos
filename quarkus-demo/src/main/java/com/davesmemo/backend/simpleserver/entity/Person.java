package com.davesmemo.backend.simpleserver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;
import java.util.Optional;

@Entity
public class Person extends PanacheEntity implements Serializable {

    @Column(name = "identityCode", unique = true)
    public String identityCode;
    public String password;
    public String name;
    @Column(columnDefinition = "integer default 5")
    public int autoTabGroupMax = 5;
    @Column(columnDefinition = "integer default 60")
    public int autoSaveInterval = 60;
    @JsonIgnore
    @OneToMany(
            mappedBy = "person",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    public List<TabGroup> tabGroups;

    public static Person findByiIdentityCode(String identityCode) {
        Optional<Person> person = find("identityCode", identityCode).singleResultOptional();
        return person.orElse(null);
    }

}