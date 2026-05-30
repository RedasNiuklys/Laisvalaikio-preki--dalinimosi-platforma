using AutoMapper;
using Server.DataTransferObjects;
using Server.Models;

namespace Server.MappingProfiles
{
    public class MaintenanceProfile : Profile
    {
        public MaintenanceProfile()
        {
            CreateMap<MaintenanceRecord, MaintenanceRecordResponseDto>();
        }
    }
}
