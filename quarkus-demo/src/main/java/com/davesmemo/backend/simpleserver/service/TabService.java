package com.davesmemo.backend.simpleserver.service;

import com.davesmemo.backend.simpleserver.entity.Person;
import com.davesmemo.backend.simpleserver.entity.TabGroup;
import com.davesmemo.backend.simpleserver.entity.TabGroupType;

import javax.enterprise.context.ApplicationScoped;
import javax.transaction.Transactional;
import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Stream;

/**
 * Date: 2020/2/26.
 * Time: 4:37 PM.
 *
 * @author David Duan
 */
@ApplicationScoped
@Transactional
public class TabService {
    public static final Logger logger = Logger.getLogger(TabService.class.getName());
    public void saveTabGroup(TabGroup tabGroup) {
        if (tabGroup.tabs != null && tabGroup.tabs.size() > 0) {
            tabGroup.tabs.forEach(tab -> {
                tab.group = tabGroup;
                logger.info(tab.title);
            });

            if (tabGroup.person != null && TabGroupType.AUTO == tabGroup.type) {
                TabGroup.shiftEarlier(tabGroup.person);
            }

            tabGroup.persist();
        }
    }
    public List<TabGroup> listAllTabGroup(String personIC) {
        return TabGroup.listAllTabGroup(personIC);
    }

    public int toManual(String personIC, long tabgroupId) {
        return TabGroup.toManual(personIC, tabgroupId);
    }

    public long removeTabGroup(String personIC, long tabgroupId) {
        return TabGroup.remove(personIC, tabgroupId);
    }
}
