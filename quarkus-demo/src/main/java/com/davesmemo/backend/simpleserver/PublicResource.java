package com.davesmemo.backend.simpleserver;

import com.davesmemo.backend.simpleserver.entity.Person;
import com.davesmemo.backend.simpleserver.entity.TabGroup;
import com.davesmemo.backend.simpleserver.service.PersonService;
import com.davesmemo.backend.simpleserver.service.TabService;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

/**
 * Date: 2020/3/2.
 * Time: 10:30 AM.
 *
 * @author David Duan
 */
@Path("/public")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class PublicResource {
    private static final Logger logger = Logger.getLogger(PublicResource.class.getName());

    @Inject
    public TabService tabService;

    @Inject
    public PersonService personService;

    @GET
    @Path("/check")
    public Response check() {
        return Response.ok("{\"app\": \"iContinue\"}").build();
    }

    @GET
    @Path("/person/new")
    public Person newPerson() {
        Person person = new Person();
        UUID uuid = UUID.randomUUID();
        person.identityCode = person.name = uuid.toString();
        personService.newPerson(person);
        return person;
    }

    @GET
    @Path("/person/{personIC}")
    public Person getPerson(@PathParam("personIC") String personIC) {
        return Person.findByiIdentityCode(personIC);
    }

    @GET
    @Path("/{personIC}/tabgroups")
    public List<TabGroup> listAllTabGroup(@PathParam("personIC") String personIC) {
        logger.info(personIC);
        return tabService.listAllTabGroup(personIC);
    }

    @POST
    @Path("/{personIC}/tabgroups")
    public Response postTabGroup(@PathParam("personIC") String personIC, TabGroup tabGroup) {
        logger.info("postTabGroup");
        tabGroup.person = personService.findByiIdentityCode(personIC);
        if (tabGroup.person != null) {
            tabService.saveTabGroup(tabGroup);
        }
        return Response.ok("{}").build();
    }

    @DELETE
    @Path("/{personIC}/tabgroups/{tabgroupId}")
    public Response removeTabGroup(@PathParam("personIC") String personIC, @PathParam("tabgroupId") long tabgroupId) {
        logger.info("turnAutoToManual:" + personIC + ":" + tabgroupId);
        tabService.removeTabGroup(personIC, tabgroupId);
        return Response.ok("{}").build();
    }

    @GET
    @Path("/{personIC}/tabgroups/{tabgroupId}/toManual")
    public Response turnAutoToManual(@PathParam("personIC") String personIC, @PathParam("tabgroupId") long tabgroupId) {
        logger.info("turnAutoToManual:" + personIC + ":" + tabgroupId);
        tabService.toManual(personIC, tabgroupId);
        return Response.ok("{}").build();
    }

    @POST
    @Path("/person/merge/{oldID}/{newID}")
    public void mergePersonId(@PathParam("oldID") String oldID, @PathParam("newID") String newID) {
        personService.applyNewIdentityCode(oldID, newID);
    }
}
