package com.davesmemo.backend.simpleserver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import io.quarkus.hibernate.orm.panache.runtime.JpaOperations;

import javax.persistence.*;
import javax.transaction.Transactional;
import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Date: 2020/2/26.
 * Time: 3:46 PM.
 *
 * @author David Duan
 */
@Entity
public class TabGroup extends PanacheEntity {

    public String name;
    @Enumerated(EnumType.STRING)
    public TabGroupType type;
    @OneToMany(
            mappedBy = "group",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    public List<Tab> tabs;
//    @Column(columnDefinition = "TIMESTAMP", updatable= false, insertable=false)
    public Timestamp createDT;

    @JsonIgnore
    @ManyToOne()
    @JoinColumn(name = "person_code",referencedColumnName = "identityCode", nullable = false)
    public Person person;

//    @JsonIgnore
//    @Transient
//    @Inject
//    private static EntityManager em;

    public TabGroup() {}



    public List<Tab> getTabs() {
        return tabs;
    }

    public static int mergeIDs(String oldID, String newID) {
        return update("person_code = ?1 where person_code =?2", newID, oldID);
    }

    public static List<TabGroup> listByPersonIdentityCode(String code) {
        return list("person_code", code);
    }

    public static List<TabGroup> listAllTabGroup(String personIC) {
        Stream<TabGroup> stream = stream("person_code=?1 order by createDT desc", personIC);
        return stream.map(t -> {
            t.getTabs();
            return t;
        }).collect(Collectors.toList());
    }

    @Transactional(Transactional.TxType.REQUIRED)
    public static int deleteAutoEarlier(TabGroup toBeShift) {
        JpaOperations.executeUpdate("DELETE FROM Tab where group_id in (select id from TabGroup where type=?1 and person_code=?2 and createDT <= ?3)", TabGroupType.AUTO, toBeShift.person.identityCode, toBeShift.createDT);
        return JpaOperations.executeUpdate("DELETE FROM TabGroup where type=?1 and person_code=?2 and createDT <= ?3", TabGroupType.AUTO, toBeShift.person.identityCode, toBeShift.createDT);
    }

    public static void shiftEarlier(Person person) {
        TabGroup toBeShift = find("type=?1 and person_code=?2 order by createDT desc", TabGroupType.AUTO, person.identityCode).page(1, person.autoTabGroupMax - 1).firstResult();
        if ( toBeShift!= null) {
            deleteAutoEarlier(toBeShift);
        }
    }

    public static int toManual(String personIC, long tabgroupId) {
        return update("type=?1 where id=?2 and type=?3 and person_code=?4",TabGroupType.MANUAL, tabgroupId, TabGroupType.AUTO, personIC);
    }

    public static long remove(String personIC, long tabgroupId) {
        Tab.delete("group_id", tabgroupId);
        return delete("id=?1 and person_code=?2", tabgroupId, personIC);
    }
}
