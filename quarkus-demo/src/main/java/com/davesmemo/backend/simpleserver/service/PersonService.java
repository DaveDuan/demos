package com.davesmemo.backend.simpleserver.service;

import com.davesmemo.backend.simpleserver.entity.Person;
import com.davesmemo.backend.simpleserver.entity.TabGroup;

import javax.enterprise.context.ApplicationScoped;
import javax.transaction.Transactional;
import java.util.List;

/**
 * Date: 2020/2/27.
 * Time: 10:16 AM.
 *
 * @author David Duan
 */
@ApplicationScoped
@Transactional
public class PersonService {

    public void newPerson(Person person) {
        person.persist();
    }

    public void applyNewIdentityCode(String oldID, String newID) {
        TabGroup.mergeIDs(oldID, newID);
    }

    public List<TabGroup> listByPersonIdentityCode(String code) {
        return TabGroup.listByPersonIdentityCode(code);
    }

    public Person findByiIdentityCode(String personIC) {
        return Person.findByiIdentityCode(personIC);
    }
}
